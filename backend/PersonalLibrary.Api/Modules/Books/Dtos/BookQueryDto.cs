using System.ComponentModel.DataAnnotations;

namespace PersonalLibrary.Api.Modules.Books.Dtos;

public class BookQueryDto
{
    public string? Search { get; set; }
    public string? Title { get; set; }
    public string? Author { get; set; }
    public int? Year { get; set; }

    [Range(1, int.MaxValue)]
    public int Page { get; set; } = 1;

    [Range(1, 50)]
    public int PageSize { get; set; } = 10;

    // sortBy: id | title | author | year
    public string? SortBy { get; set; } = "id";

    // asc | desc
    public string? SortDir { get; set; } = "desc";
}
