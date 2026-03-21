using System;
using System.Linq;
using System.Threading.Tasks;
using BoardGameHub.Api.Data;
using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace BoardGameHub.Tests.Services;

public class SocialServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly SocialService _service;

    public SocialServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
            
        _context = new AppDbContext(options);
        _service = new SocialService(_context);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task SaveChatMessage_ShouldAddMessageToDb()
    {
        await _service.SaveChatMessage("UserA", "UserB", "Hello B!");

        var msg = await _context.ChatMessages.FirstOrDefaultAsync();
        msg.Should().NotBeNull();
        msg!.SenderId.Should().Be("UserA");
        msg.ReceiverId.Should().Be("UserB");
        msg.Content.Should().Be("Hello B!");
    }

    [Fact]
    public async Task SaveGlobalMessage_ShouldAddMessageToDbWithNullReceiver()
    {
        await _service.SaveGlobalMessage("UserA", "Hello Global!");

        var msg = await _context.ChatMessages.FirstOrDefaultAsync();
        msg.Should().NotBeNull();
        msg!.SenderId.Should().Be("UserA");
        msg.ReceiverId.Should().BeNull();
        msg.Content.Should().Be("Hello Global!");
    }

    [Fact]
    public async Task GetPrivateChatHistory_ShouldReturnCorrectMessages()
    {
        _context.Users.AddRange(
            new User { Id = "A", UserName = "UserA" },
            new User { Id = "B", UserName = "UserB" },
            new User { Id = "C", UserName = "UserC" }
        );
        _context.ChatMessages.AddRange(
            new ChatMessage { SenderId = "A", ReceiverId = "B", Content = "Msg1", Timestamp = DateTime.UtcNow.AddMinutes(-5) },
            new ChatMessage { SenderId = "B", ReceiverId = "A", Content = "Msg2", Timestamp = DateTime.UtcNow.AddMinutes(-4) },
            new ChatMessage { SenderId = "A", ReceiverId = "C", Content = "Msg3", Timestamp = DateTime.UtcNow.AddMinutes(-3) },
            new ChatMessage { SenderId = "A", ReceiverId = "B", Content = "Msg4", Timestamp = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        var history = await _service.GetPrivateChatHistory("A", "B", 10, 0);

        history.Should().HaveCount(3);
        history[0].Content.Should().Be("Msg1");
        history[1].Content.Should().Be("Msg2");
        history[2].Content.Should().Be("Msg4");
    }

    [Fact]
    public async Task GetGlobalChatHistory_ShouldReturnOnlyGlobalMessages()
    {
        _context.Users.AddRange(
            new User { Id = "A", UserName = "UserA" },
            new User { Id = "B", UserName = "UserB" },
            new User { Id = "C", UserName = "UserC" }
        );
        _context.ChatMessages.AddRange(
            new ChatMessage { SenderId = "A", ReceiverId = null, Content = "Global1", Timestamp = DateTime.UtcNow.AddMinutes(-2) },
            new ChatMessage { SenderId = "B", ReceiverId = "A", Content = "Private1", Timestamp = DateTime.UtcNow.AddMinutes(-1) },
            new ChatMessage { SenderId = "C", ReceiverId = null, Content = "Global2", Timestamp = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        var history = await _service.GetGlobalChatHistory(10);

        history.Should().HaveCount(2);
        history[0].Content.Should().Be("Global1");
        history[1].Content.Should().Be("Global2");
    }

    [Fact]
    public async Task SendFriendRequest_ShouldCreatePendingFriendship()
    {
        await _service.SendFriendRequest("UserA", "UserB");

        var friendship = await _context.Friendships.FirstOrDefaultAsync();
        friendship.Should().NotBeNull();
        friendship!.RequesterId.Should().Be("UserA");
        friendship.AddresseeId.Should().Be("UserB");
        friendship.Status.Should().Be(FriendshipStatus.Pending);
    }

    [Fact]
    public async Task SendFriendRequest_ShouldNotDuplicateRequest()
    {
        _context.Friendships.Add(new Friendship { RequesterId = "UserA", AddresseeId = "UserB", Status = FriendshipStatus.Pending });
        await _context.SaveChangesAsync();

        await _service.SendFriendRequest("UserA", "UserB");

        var count = await _context.Friendships.CountAsync();
        count.Should().Be(1);
    }

    [Fact]
    public async Task AcceptFriendRequest_ShouldChangeStatusToAccepted()
    {
        var friendship = new Friendship { RequesterId = "A", AddresseeId = "B", Status = FriendshipStatus.Pending };
        _context.Friendships.Add(friendship);
        await _context.SaveChangesAsync();

        await _service.AcceptFriendRequest("A", "B");

        var updated = await _context.Friendships.FirstAsync();
        updated.Status.Should().Be(FriendshipStatus.Accepted);
    }

    [Fact]
    public async Task GetFriends_ShouldReturnBothSentAndReceivedAcceptedRequests()
    {
        var userA = new User { Id = "A", UserName = "UserA" };
        var userB = new User { Id = "B", UserName = "UserB" };
        var userC = new User { Id = "C", UserName = "UserC" };
        
        _context.Users.AddRange(userA, userB, userC);
        
        _context.Friendships.AddRange(
            new Friendship { RequesterId = "A", AddresseeId = "B", Status = FriendshipStatus.Accepted, Requester = userA, Addressee = userB },
            new Friendship { RequesterId = "C", AddresseeId = "A", Status = FriendshipStatus.Accepted, Requester = userC, Addressee = userA },
            new Friendship { RequesterId = "A", AddresseeId = "D", Status = FriendshipStatus.Pending } // Ignored
        );
        await _context.SaveChangesAsync();

        var friends = await _service.GetFriends("A");

        friends.Should().HaveCount(2);
        friends.Select(f => f.Id).Should().Contain(new[] { "B", "C" });
    }

    [Fact]
    public async Task GetFriendRequests_ShouldReturnPendingRequestsAddressedToUser()
    {
        var userA = new User { Id = "A", UserName = "UserA" };
        var userB = new User { Id = "B", UserName = "UserB" };
        
        _context.Users.AddRange(userA, userB);
        
        _context.Friendships.AddRange(
            new Friendship { RequesterId = "B", AddresseeId = "A", Status = FriendshipStatus.Pending, Requester = userB, Addressee = userA },
            new Friendship { RequesterId = "A", AddresseeId = "C", Status = FriendshipStatus.Pending } // Sent by A, not received
        );
        await _context.SaveChangesAsync();

        var requests = await _service.GetFriendRequests("A");

        requests.Should().HaveCount(1);
        requests[0].RequesterId.Should().Be("B");
    }
}
