namespace PersonalLibrary.Api.Contracts.Books;

public class GoogleBookDto
{
    public string? Title { get; set; }
    public string? Authors { get; set; }
    public string? Description { get; set; }
    public string? Publisher { get; set; }
    public string? PublishedDate { get; set; }
    public int? PageCount { get; set; }
    public string? CoverImageUrl { get; set; }
    public string? Language { get; set; }
}
