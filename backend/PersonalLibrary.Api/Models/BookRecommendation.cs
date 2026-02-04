namespace PersonalLibrary.Api.Models;

public class BookRecommendation
{
    public int Id { get; set; }

    public int FromUserId { get; set; }
    public User FromUser { get; set; } = null!;

    public int ToUserId { get; set; }
    public User ToUser { get; set; } = null!;

    public int BookId { get; set; }
    public Book Book { get; set; } = null!;

    public string? Message { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
