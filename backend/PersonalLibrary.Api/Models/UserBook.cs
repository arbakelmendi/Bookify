namespace PersonalLibrary.Api.Models;

public class UserBook
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public int BookId { get; set; }

    // "Reading", "Finished", "Planned"
    public string Status { get; set; } = "Reading";

    // Progress fields
    public int TotalPages { get; set; }          // required for validation
    public int CurrentPage { get; set; } = 1;    // last opened page in PDF reader
    public int PagesRead { get; set; } = 0;      // 0..TotalPages
    public double Percent { get; set; } = 0;     // 0..100
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
    public Book? Book { get; set; }
}
