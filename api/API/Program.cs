var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowOriginPolicy", builder =>
    {
        builder.AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

var app = builder.Build();
app.UseRouting();

app.UseAuthorization();

app.UseCors("AllowOriginPolicy");

app.UseEndpoints(endpoints => { endpoints.MapControllers(); });

app.Run();