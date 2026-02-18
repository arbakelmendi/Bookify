using PersonalLibrary.Api.Models;
using PersonalLibrary.Api.Modules.Books.Dtos;

namespace PersonalLibrary.Api.Modules.Books.Mappers;

public static class BookMapper
{
public static BookDto ToDto(this Book b)
{
    return new BookDto
    {
        Id = b.Id,
        Title = b.Title,
        Author = b.Author,
        Description = b.Description,
        CoverImageUrl = b.CoverImageUrl,
        Year = b.Year,
        PdfUrl = b.PdfUrl,
        PreviewUrl = b.PreviewUrl
    };
}
}
