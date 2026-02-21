using PersonalLibrary.Api.Models;
using PersonalLibrary.Api.Modules.Books.Dtos;

namespace PersonalLibrary.Api.Modules.Books.Mappers;

public static class BookMapper
{
public static BookDto ToDto(this Book b, double? rating = null)
{
    return new BookDto
    {
        Id = b.Id,
        Title = b.Title,
        Author = b.Author,
        Description = b.Description,
        CoverImageUrl = b.CoverImageUrl,
        Year = b.Year,
        CategoryId = b.CategoryId,
        Category = b.Category?.Name,
        Rating = rating,
        PdfUrl = b.PdfUrl,
        PreviewUrl = b.PreviewUrl
    };
}
}
