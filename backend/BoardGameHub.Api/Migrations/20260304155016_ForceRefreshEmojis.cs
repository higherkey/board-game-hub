using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BoardGameHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class ForceRefreshEmojis : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData("Games", "Id", "Scatterbrain", "Icon", "🧠");
            migrationBuilder.UpdateData("Games", "Id", "Babble", "Icon", "🔤");
            migrationBuilder.UpdateData("Games", "Id", "OneAndOnly", "Icon", "🃏");
            migrationBuilder.UpdateData("Games", "Id", "NomDeCode", "Icon", "🕵️‍♀️");
            migrationBuilder.UpdateData("Games", "Id", "Warships", "Icon", "🚢");
            migrationBuilder.UpdateData("Games", "Id", "FourInARow", "Icon", "🔴");
            migrationBuilder.UpdateData("Games", "Id", "UniversalTranslator", "Icon", "👽");
            migrationBuilder.UpdateData("Games", "Id", "Pictophone", "Icon", "🎨");
            migrationBuilder.UpdateData("Games", "Id", "Wisecrack", "Icon", "💬");
            migrationBuilder.UpdateData("Games", "Id", "Poppycock", "Icon", "🤥");
            migrationBuilder.UpdateData("Games", "Id", "Symbology", "Icon", "💡");
            migrationBuilder.UpdateData("Games", "Id", "BreakingNews", "Icon", "📰");
            migrationBuilder.UpdateData("Games", "Id", "Deepfake", "Icon", "🤖");
            migrationBuilder.UpdateData("Games", "Id", "SushiTrain", "Icon", "🍣");
            migrationBuilder.UpdateData("Games", "Id", "GreatMinds", "Icon", "🌟");
            migrationBuilder.UpdateData("Games", "Id", "Farkle", "Icon", "🎲");
            migrationBuilder.UpdateData("Games", "Id", "Spectrum", "Icon", "🌈");
            migrationBuilder.UpdateData("Games", "Id", "Courtship", "Icon", "💌");
            migrationBuilder.UpdateData("Games", "Id", "SilentHeist", "Icon", "🤫");
            migrationBuilder.UpdateData("Games", "Id", "FoleyArtist", "Icon", "🎤");
            migrationBuilder.UpdateData("Games", "Id", "LostInTranslation", "Icon", "🗣️");
            migrationBuilder.UpdateData("Games", "Id", "CodeBreaker", "Icon", "🔐");
            migrationBuilder.UpdateData("Games", "Id", "Yacht", "Icon", "⛵");
            migrationBuilder.UpdateData("Games", "Id", "Terminal", "Icon", "📟");
            migrationBuilder.UpdateData("Games", "Id", "CloverMinded", "Icon", "🍀");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
