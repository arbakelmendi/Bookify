namespace PersonalLibrary.Api.Modules.Reading.Dtos;

public record PdfProgressViewDto(
    int BookId,
    int UserBookId,
    int CurrentPage,
    int TotalPages,
    int PagesRead,
    double Percent,
    string Status,
    DateTime LastUpdated
);

