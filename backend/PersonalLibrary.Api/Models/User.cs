namespace PersonalLibrary.Api.Models;

public class User
{
    public int Id { get; set; }

    public string Email { get; set; } = string.Empty;

    // If you already have PasswordHash, Username, etc. you can add them later.
}