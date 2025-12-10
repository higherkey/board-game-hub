using System.ComponentModel.DataAnnotations.Schema;

namespace BoardGameHub.Api.Models;

public class Friendship
{
    public int Id { get; set; }
    
    public string RequesterId { get; set; } = string.Empty;
    [ForeignKey("RequesterId")]
    public User? Requester { get; set; }

    public string AddresseeId { get; set; } = string.Empty;
    [ForeignKey("AddresseeId")]
    public User? Addressee { get; set; }

    public FriendshipStatus Status { get; set; } = FriendshipStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum FriendshipStatus
{
    Pending,
    Accepted,
    Declined,
    Blocked
}
