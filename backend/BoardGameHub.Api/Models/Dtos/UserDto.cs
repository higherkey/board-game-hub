namespace BoardGameHub.Api.Models.Dtos;

public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string FriendId => Id; // Backward compatibility with frontend template bindings
    public string UserName { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string? AvatarUrl { get; set; }
}
