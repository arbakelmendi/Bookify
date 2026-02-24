using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PersonalLibrary.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddEditedAtToMessages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "EditedAt",
                table: "Messages",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EditedAt",
                table: "Messages");
        }
    }
}
