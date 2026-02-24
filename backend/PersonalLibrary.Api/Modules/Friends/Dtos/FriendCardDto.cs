namespace PersonalLibrary.Api.Modules.Friends.Dtos;

public record FriendCardDto(
    int Id,
    string Email,
    string? Username,
    int BooksCount,
    List<FriendRecentBookDto> RecentBooks
);
