namespace PersonalLibrary.Api.Models;

public class User
{
    public int Id { get; set; }

    public string Email { get; set; } = string.Empty;

    public string Username { get; set; } = string.Empty;

    public string Role { get; set; } = "user";

    public string? Bio { get; set; }

     // Store hashed password (NOT plain text)
    public string PasswordHash { get; set; } = string.Empty;
}

