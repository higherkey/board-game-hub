using System.ComponentModel.DataAnnotations.Schema;

namespace BoardGameHub.Api.Models;

public class ChatMessage
{
    public int Id { get; set; }
    
    public string SenderId { get; set; } = string.Empty;
    [ForeignKey("SenderId")]
    public User? Sender { get; set; }

    public string? ReceiverId { get; set; } // Null for Global Chat
    [ForeignKey("ReceiverId")]
    public User? Receiver { get; set; }

    public string Content { get; set; } = string.Empty;
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    
    public bool IsGlobal { get; set; } = false;
}
