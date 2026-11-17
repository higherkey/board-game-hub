using System.Collections;

namespace BoardGameHub.Api.Models;

/// <summary>
/// Keeps the ten latest snapshots in newest-first order. Access requires the room's StateLock.
/// </summary>
public sealed class UndoHistory : IReadOnlyCollection<string>
{
    private const int Capacity = 10;
    private readonly string?[] _snapshots = new string?[Capacity];
    private int _next;

    public int Count { get; private set; }

    public void Push(string snapshot)
    {
        // Once full, the next slot holds the oldest snapshot and can be overwritten.
        _snapshots[_next] = snapshot;
        _next = (_next + 1) % Capacity;
        if (Count < Capacity) Count++;
    }

    public string Pop()
    {
        if (Count == 0) throw new InvalidOperationException("Undo history is empty.");

        _next = (_next + Capacity - 1) % Capacity;
        var snapshot = _snapshots[_next]!;
        _snapshots[_next] = null;
        Count--;
        return snapshot;
    }

    public void Clear()
    {
        Array.Clear(_snapshots);
        _next = 0;
        Count = 0;
    }

    public IEnumerator<string> GetEnumerator()
    {
        for (var i = 0; i < Count; i++)
            yield return _snapshots[(_next + Capacity - 1 - i) % Capacity]!;
    }

    IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
}
