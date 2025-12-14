using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace BoardGameHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class RemoveBrandedGames : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Catan");

            migrationBuilder.DeleteData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Chess");

            migrationBuilder.DeleteData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Monopoly");

            migrationBuilder.DeleteData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Pictionary");

            migrationBuilder.DeleteData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Scrabble");

            migrationBuilder.DeleteData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Spyfall");

            migrationBuilder.DeleteData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "TicketToRide");

            migrationBuilder.DeleteData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Uno");

            migrationBuilder.InsertData(
                table: "Games",
                columns: new[] { "Id", "Description", "Icon", "Name", "Status" },
                values: new object[,]
                {
                    { "BreakingNews", "Frantic teleprompter fun where writers sabotage the anchor.", "📰", "Breaking News", 2 },
                    { "Pictophone", "Draw, guess, and laugh as the message gets distorted.", "🖍️", "Pictophone", 2 },
                    { "Poppycock", "Bluff your friends with fake definitions.", "🤥", "Poppycock", 2 },
                    { "Symbology", "Communicate ideas using universal icons.", "💡", "Symbology", 2 },
                    { "UniversalTranslator", "Decipher the alien message before 'J' jams the signal.", "👽", "Universal Translator", 2 },
                    { "Wisecrack", "Answer simple prompts with witty answers.", "💬", "Wisecrack", 2 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "BreakingNews");

            migrationBuilder.DeleteData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Pictophone");

            migrationBuilder.DeleteData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Poppycock");

            migrationBuilder.DeleteData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Symbology");

            migrationBuilder.DeleteData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "UniversalTranslator");

            migrationBuilder.DeleteData(
                table: "Games",
                keyColumn: "Id",
                keyValue: "Wisecrack");

            migrationBuilder.InsertData(
                table: "Games",
                columns: new[] { "Id", "Description", "Icon", "Name", "Status" },
                values: new object[,]
                {
                    { "Catan", "Trade, build, and settle the island of Catan.", "🏰", "Settlers of Catan", 2 },
                    { "Chess", "Strategic board game played on a checkered board.", "♟️", "Chess", 2 },
                    { "Monopoly", "Buy, sell, and trade properties to win.", "🎩", "Monopoly", 2 },
                    { "Pictionary", "Draw and guess words with your friends.", "🎨", "Pictionary", 2 },
                    { "Scrabble", "Create words on the board using letter tiles.", "📝", "Scrabble", 2 },
                    { "Spyfall", "Find the spy among you before they figure out the location.", "🕵️", "Spyfall", 2 },
                    { "TicketToRide", "Build train routes across the country.", "🚂", "Ticket to Ride", 2 },
                    { "Uno", "The classic card game of matching colors and numbers.", "🃏", "Uno", 2 }
                });
        }
    }
}
