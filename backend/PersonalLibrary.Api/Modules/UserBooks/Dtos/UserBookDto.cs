namespace PersonalLibrary.Api.Modules.UserBooks.Dtos;

public class UserBookDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int BookId { get; set; }
    public string Status { get; set; } = "Reading";

    public int CurrentPage { get; set; } = 1;
    public int PagesRead { get; set; }
    public int TotalPages { get; set; }
    public double Percent { get; set; }
    public DateTime LastUpdated { get; set; }

    public string Title { get; set; } = string.Empty;
    public string? Author { get; set; }
    public string Description { get; set; } = string.Empty;
    public string CoverImageUrl { get; set; } = string.Empty;
    public int? Year { get; set; }
}
