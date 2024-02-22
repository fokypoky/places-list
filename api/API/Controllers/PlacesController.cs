using Infrastructure.Repositories;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using API.Models;
using System.Diagnostics;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PlacesController : ControllerBase
    {
        private readonly PlacesRepository _placesRepository;

        public PlacesController()
        {
            _placesRepository = new PlacesRepository(new Uri(Environment.GetEnvironmentVariable("elastic-uri")));
        }

        [HttpGet]
        public ActionResult Get()
        {
            try
            {
                return Ok(JsonConvert.SerializeObject(_placesRepository.GetAll()));
            } 
            catch(Exception e)
            {
                return StatusCode(500, e.Message);
            }
        }

        [HttpGet("{id}")]
        public ActionResult Get(string id)
        {
            try
            {
                return Ok(JsonConvert.SerializeObject(_placesRepository.GetById(id)));
            }
            catch (Exception e)
            {
                return StatusCode(500, e.Message);
            }
        }

        [HttpGet("find/id/{title}")]
        public ActionResult GetId(string title)
        {
            Debug.WriteLine(title);
            try
            {
               return Ok(JsonConvert.SerializeObject(_placesRepository.GetId(title)));
            }
            catch (Exception e)
            {
                return StatusCode(500, e.Message);
            }
        }

        [HttpPost]
        public ActionResult Post(string title, string description, string visitDate) 
        {
            try
            {
                return Ok(_placesRepository.Create(new Place(title, description, visitDate)));
            }
            catch (Exception e)
            {
                return StatusCode(500, e.Message);
            }
        }

        [HttpPut("{id}")]
        public ActionResult Put(string id, string title, string description, string visitDate)
        {
            try
            {
                _placesRepository.Update(new Place(id, title, description, visitDate));
                return Ok();
            }
            catch(Exception e)
            {
                return StatusCode(500, e.Message);
            }
        }

        [HttpDelete("{id}")]
        public ActionResult Delete(string id) 
        {
            try
            {
                _placesRepository.Delete(id);
                return Ok();
            }
            catch(Exception e)
            {
                return StatusCode(500, e.Message);
            }
        }
    }
}