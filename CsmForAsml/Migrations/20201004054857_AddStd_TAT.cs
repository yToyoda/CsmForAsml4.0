using Microsoft.EntityFrameworkCore.Migrations;

namespace CsmForAsml.Migrations
{
    public partial class AddStd_TAT : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TAT");

            migrationBuilder.AddColumn<int>(
                name: "Std_TAT",
                table: "MaterialNeedCal",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Std_TAT",
                table: "MaterialNeedCal");

            migrationBuilder.CreateTable(
                name: "TAT",
                columns: table => new
                {
                    Material = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Ave_TAT = table.Column<int>(type: "int", nullable: true),
                    Max_TAT = table.Column<int>(type: "int", nullable: true),
                    Min_TAT = table.Column<int>(type: "int", nullable: true),
                    Num_Actual = table.Column<int>(type: "int", nullable: false),
                    PriceFromVendor = table.Column<decimal>(type: "money", nullable: true),
                    PriceToUser = table.Column<decimal>(type: "money", nullable: true),
                    SquareSum_TAT = table.Column<int>(type: "int", nullable: true),
                    StdDev_TAT = table.Column<double>(type: "float", nullable: true),
                    Std_TAT = table.Column<int>(type: "int", nullable: false),
                    Sum_TAT = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_dbo.TAT", x => x.Material);
                });
        }
    }
}
