namespace PersonalLibrary.Api.Modules.Users.Dtos;

public class UpdateUserDto
{
    public string Email { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}