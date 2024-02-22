using API.Models;
using Nest;

namespace Infrastructure.Repositories 
{
    public class PlacesRepository
    {
        private ElasticClient _client;

        public PlacesRepository(Uri connectionUri)
        {
            var node = connectionUri;
            var settings = new ConnectionSettings(node).DefaultIndex("places");
            _client = new ElasticClient(settings); 
        }

        public List<Place> GetAll() 
        {
            var response = _client.Search<Place>(s => s.Query(q => q.MatchAll()));
            
            var result = new List<Place>();

            for(int i = 0; i < response.Documents.Count; i++) 
            {
                var place = response.Documents.ElementAt(i);
                result.Add(new Place(id: response.Hits.ElementAt(i).Id, title: place.Title, 
                    description: place.Description, visitDate: place.VisitDate)
                );
            }
            
            return result;
        }

        public string GetId(string title)
        {
            var response = _client.Search<Place>(s => s
                .Query(q => q
                    .Match(m => m
                        .Field(f => f.Title) // Поле "title"
                        .Query(title) // Значение title, по которому производится поиск
                    )
                )
            );
            
            return response.Hits.FirstOrDefault()?.Id ?? "";
        }

        public Place GetById(string id)
        {
            var response = _client.Get<Place>(id);
            return new Place(id, response.Source.Title, 
                response.Source.Description, response.Source.VisitDate
            );
        }

        public string Create(Place place)
        { 
            var result = _client.IndexDocument(new {
                title = place.Title,
                description = place.Description,
                visit_date = place.VisitDate
            });

            return result.Id;
        }

        public void Update(Place place)
        {
            _client.UpdateByQuery<Place>(u => u
            .Query(q => q
                .Term(f => f.Id, place.Id)
            )
            .Script(s => s
                .Source("ctx._source.title = params.title; ctx._source.description = params.description; ctx._source.visit_date = params.visitDate")
                .Params(p => p
                    .Add("title", place.Title)
                    .Add("description", place.Description)
                    .Add("visitDate", place.VisitDate)
                    )
                )
            );
        }

        public void Delete(string id) => _client.Delete<Place>(id);
    } 
}