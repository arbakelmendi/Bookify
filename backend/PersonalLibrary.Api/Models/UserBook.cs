namespace PersonalLibrary.Api.Models;

public class UserBook
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public int BookId { get; set; }

    // p.sh. "Reading", "Completed", "Planned"
    public string Status { get; set; } = "Reading";

    public User? User { get; set; }
    public Book? Book { get; set; }
}