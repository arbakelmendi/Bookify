namespace PersonalLibrary.Api.Modules.Auth.Dtos;

using PersonalLibrary.Api.Modules.Users.Dtos;

public record AuthResponseDto(string Token, UserDto User);