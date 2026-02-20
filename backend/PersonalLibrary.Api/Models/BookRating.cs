namespace PersonalLibrary.Api.Models;

public class BookRating
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public int BookId { get; set; }

    public int Value { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}