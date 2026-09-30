namespace BoardGameHub.Api.Models.Dtos;

public class ChatMessageDto
{
    public int Id { get; set; }
    public string SenderId { get; set; } = string.Empty;
    public string? ReceiverId { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public bool IsGlobal { get; set; }
    public UserDto? Sender { get; set; }
}

public class FriendRequestDto
{
    public int Id { get; set; }
    public string RequesterId { get; set; } = string.Empty;
    public string AddresseeId { get; set; } = string.Empty;
    public FriendshipStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public UserDto? Requester { get; set; }
}
