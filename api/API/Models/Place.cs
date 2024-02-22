using System.ComponentModel.DataAnnotations;
using Nest;

namespace API.Models
{
    public class Place 
    {
        [PropertyName("_id")]
        public string Id { get; set; }
        [PropertyName("title")]
        public string Title { get; set; }
        [PropertyName("description")]
        public string Description { get; set; }
        [PropertyName("visit_date")]
        public string VisitDate { get; set; }

        public Place(string id, string title, string description, string visitDate)
        {
            Id = id;
            Title = title;
            Description = description;
            VisitDate = visitDate;
        }

        public Place(string title, string description, string visitDate)
        {
            Title = title;
            Description = description;
            VisitDate = visitDate;
        }

        public Place() { }
        
    }
}