namespace PersonalLibrary.Api.Modules.Reading.Dtos;

public record ReadingDto(
    int Id,
    int UserId,
    int BookId,
    string Status,
    int TotalPages,
    int PagesRead,
    double Percent,
    DateTime StartedAt,
    DateTime LastUpdated
);
