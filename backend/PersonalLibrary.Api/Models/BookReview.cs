namespace PersonalLibrary.Api.Models;

public class BookReview
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public int BookId { get; set; }

    public string Text { get; set; } = "";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // ✅ MUST be nullable
    public DateTime? UpdatedAt { get; set; }
}
