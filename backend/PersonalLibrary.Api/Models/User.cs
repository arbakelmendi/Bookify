namespace PersonalLibrary.Api.Models;

public class User
{
    public int Id { get; set; }

    public string Email { get; set; } = string.Empty;

     // Store hashed password (NOT plain text)
    public string PasswordHash { get; set; } = string.Empty;
}

