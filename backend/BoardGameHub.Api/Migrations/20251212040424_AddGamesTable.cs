using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace BoardGameHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddGamesTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Games",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Icon = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Games", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "Games",
                columns: new[] { "Id", "Description", "Icon", "Name", "Status" },
                values: new object[,]
                {
                    { "Battleship", "Sink your opponent's fleet before they sink yours.", "🚢", "Battleship", 2 },
                    { "Boggle", "Find as many words as you can in the grid of letters before time runs out!", "🔤", "Boggle", 0 },
                    { "Catan", "Trade, build, and settle the island of Catan.", "🏰", "Settlers of Catan", 2 },
                    { "Checkers", "Jump over opponent pieces to capture them.", "🏁", "Checkers", 2 },
                    { "Chess", "Strategic board game played on a checkered board.", "♟️", "Chess", 2 },
                    { "Codenames", "Give one-word clues to help your team guess their agents.", "🕵️‍♀️", "Codenames", 2 },
                    { "Connect4", "Connect four of your checkers in a row.", "🔴", "Connect 4", 2 },
                    { "JustOne", "Work together to guess the mystery word by writing unique one-word clues.", "🃏", "Just One", 0 },
                    { "Monopoly", "Buy, sell, and trade properties to win.", "🎩", "Monopoly", 2 },
                    { "Pictionary", "Draw and guess words with your friends.", "🎨", "Pictionary", 2 },
                    { "Scatterbrain", "The classic party game. Come up with unique answers for categories for a chosen letter.", "🧠", "Scatterbrain", 0 },
                    { "Scrabble", "Create words on the board using letter tiles.", "📝", "Scrabble", 2 },
                    { "Spyfall", "Find the spy among you before they figure out the location.", "🕵️", "Spyfall", 2 },
                    { "TicketToRide", "Build train routes across the country.", "🚂", "Ticket to Ride", 2 },
                    { "Uno", "The classic card game of matching colors and numbers.", "🃏", "Uno", 2 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Games");
        }
    }
}
