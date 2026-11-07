using System.Reflection;
using BoardGameHub.Api.Services;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace BoardGameHub.Tests.Infrastructure;

/// <summary>
/// Guards the production DI graph against the RoomService / GameStateManager / RoomPersistenceWorker
/// cycle that hung startup on Render (#213, #214), while ensuring persistence stays wired in (#215).
/// </summary>
public class DependencyGraphTests
{
    private static readonly TimeSpan ResolveTimeout = TimeSpan.FromSeconds(15);

    [Fact]
    public async Task RoomGraph_ResolvesWithoutDeadlock_AndPersistenceIsWired()
    {
        using var factory = new TestBase();

        var resolveTask = Task.Run(() =>
        {
            var sp = factory.Services;
            return (
                Room: sp.GetRequiredService<IRoomService>(),
                Gsm: sp.GetRequiredService<GameStateManager>(),
                Persistence: sp.GetRequiredService<IRoomPersistenceService>(),
                Worker: sp.GetRequiredService<RoomPersistenceWorker>());
        });

        var completed = await Task.WhenAny(resolveTask, Task.Delay(ResolveTimeout));
        Assert.True(completed == resolveTask, "Resolving the room service graph timed out (possible DI cycle).");

        var (room, gsm, persistence, worker) = await resolveTask;

        Assert.Same(worker, persistence);
        Assert.Same(persistence, GetPrivateField(gsm, "_persistenceService"));
        Assert.Same(persistence, GetPrivateField(room, "_persistenceService"));
        Assert.NotNull(GetPrivateField(room, "_scopeFactory"));
        Assert.NotNull(GetPrivateField(gsm, "_serializer"));

        // Worker must be built with its lean constructor (lazy resolution), never the greedy one.
        Assert.Null(GetPrivateField(worker, "_roomService"));
        Assert.Null(GetPrivateField(worker, "_gameStateManager"));
    }

    private static object? GetPrivateField(object target, string name)
    {
        var field = target.GetType().GetField(name, BindingFlags.Instance | BindingFlags.NonPublic);
        Assert.NotNull(field);
        return field!.GetValue(target);
    }
}
