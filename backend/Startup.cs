using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.HttpsPolicy;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using NSwag.AspNetCore.Middlewares;

using backend.Communication;
using backend.Middleware;
using backend.Model;
using Microsoft.EntityFrameworkCore;

namespace backend
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddRouting(options =>
            {
                options.LowercaseUrls = true;
            });
            services.AddControllers();

            services.AddSingleton<ExhibitConnectionManager>();
            services.AddHostedService<ExhibitConnectionManager>(provider => provider.GetService<ExhibitConnectionManager>());

            services.AddMyHttpContextAccessor();

            services.AddOpenApiDocument();

            services.AddDbContext<EmtContext>(options =>
            {
                options.UseSqlite("Filename=emt.db");
            });
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                // Allow http in dev
                app.UseHttpsRedirection();
            }


            app.UsePathBase("/api");
            app.UseRouting();
            app.UseWebSockets();

            app.UseHttpContext();

            app.UseCors(builder => builder
                .AllowAnyOrigin());

            app.UseAuthentication();
            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });

            var localDataPath = Configuration["EMToolbox:LocalPackageStoratePath"];
            if (localDataPath != null)
            {
                System.Environment.SetEnvironmentVariable("EMTOOLBOX_STORAGE", localDataPath);
            }

            var cmtoolboxApiUrl = Configuration["EMToolbox:CMToolboxApiUrl"];
            if (cmtoolboxApiUrl != null)
            {
                System.Environment.SetEnvironmentVariable("CMTOOLBOX_API_URL", cmtoolboxApiUrl);
            }
        }
    }
}
