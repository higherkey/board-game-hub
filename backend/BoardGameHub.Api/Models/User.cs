using Microsoft.AspNetCore.Identity;

namespace BoardGameHub.Api.Models;

public class User : IdentityUser
{
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
