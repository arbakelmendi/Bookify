namespace PersonalLibrary.Api.Modules.Reading.Dtos;

public class CreateReadingDto
{
    public int BookId { get; set; }
    public string Status { get; set; } = "Reading";
}