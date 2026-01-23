namespace PersonalLibrary.Api.Models;

public class BookRating
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public int BookId { get; set; }

    // 1 - 5
    public int Rating { get; set; }

    public User? User { get; set; }
    public Book? Book { get; set; }
}
