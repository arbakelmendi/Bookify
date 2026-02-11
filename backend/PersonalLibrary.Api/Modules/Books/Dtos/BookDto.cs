namespace PersonalLibrary.Api.Modules.Books.Dtos;

public class BookDto
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? Author { get; set; }

    public string Description { get; set; } = string.Empty;

    public string CoverImageUrl { get; set; } = string.Empty;

    public int? Year { get; set; }
}
