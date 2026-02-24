namespace PersonalLibrary.Api.Modules.Friends.Dtos;

public record FriendLibraryBookDto(
    int BookId,
    string Title,
    string? Author,
    string CoverImageUrl,
    string Status,
    int? PagesRead,
    int? TotalPages,
    double? Percent
);
