namespace BoardGameHub.Api.Models;

public enum UndoVoteResult
{
    Pending,
    Passed,
    Failed
}

public sealed record UndoVoteSubmission(Room Room, UndoVoteResult Result);
