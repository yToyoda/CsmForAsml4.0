using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace CsmForAsml.Models
{
    public partial class CalInProcessCore
    {
        public int Id { get; set; }
        public string SerialNumber { get; set; }
        public DateTime? RegisteredDate { get; set; }
        public DateTime? UserShipDate { get; set; }
        public DateTime? VenReceiveDate { get; set; }
        public DateTime? CalDate { get; set; }
        public bool? CalResult { get; set; }
        public string VenComment { get; set; }
        public DateTime? PlanedShipDate { get; set; }
        public DateTime? VenShipDate { get; set; }
        public DateTime? UserReceiveDate { get; set; }
        public DateTime? CcReceiveDate { get; set; }
        public DateTime? CcUploadDate { get; set; }
        public int? Tat { get; set; }
        public bool Finished { get; set; }
        public string Plant { get; set; }
        public int? StdTat { get; set; }
        public string TatStatus { get; set; }
    }

    public partial class CalInProcess : CalInProcessCore {

    }

    public partial class CalInProcessBU: CalInProcessCore {

    }

    public class DateTimeConverter : JsonConverter<DateTime?> {
        public override DateTime? Read(
            ref Utf8JsonReader reader,
            Type typeToConvert,
            JsonSerializerOptions options) =>
                DateTime.Parse(reader.GetString());

        public override void Write(
            Utf8JsonWriter writer,
            DateTime? dateTimeValue,
            JsonSerializerOptions options) =>
                writer.WriteStringValue((dateTimeValue == null) ? "" : ((DateTime)dateTimeValue).ToShortDateString());
    }
}
