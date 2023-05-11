using System.Text;
using Dbscan;
using Dbscan.RBush;
using Microsoft.AspNetCore.Mvc;

namespace Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SimulationController : Controller
{
    private readonly ILogger<SimulationController> _logger;

    public SimulationController(ILogger<SimulationController> logger)
    {
        _logger = logger;
    }

    [HttpPost("[action]")]
    public async IAsyncEnumerable<object> ComputeAnomalies([FromBody] List<SimulationData> simulationData)
    {
        const int padding = 2;
        foreach (var sim in simulationData)
        {
            var indices = new List<int>();
            await Task.Run(() =>
            {
                var pointData = new List<SimulationPoint>();
                for (var i = 0; i < padding; i++)
                    pointData.Add(new SimulationPoint(0, sim.History[0]));
                pointData.AddRange(sim.History.Select((t, i) => new SimulationPoint(0, t)));
                for (var i = 0; i < padding; i++)
                    pointData.Add(new SimulationPoint(0, sim.History[sim.History.Count - 1]));
                var clusterSet = Dbscan.Dbscan.CalculateClusters(pointData, sim.BuyFactor / 3, 8);

                // Note: DBScan only returns the values and not the indices. We could fork the repo and modify the library for a performance boost.
                // This will not be done as this project is more of a concept/prototype. Thus, we will filter through the points and compare with hashset.
                var anomalies = new HashSet<SimulationPoint>(clusterSet.UnclusteredObjects);
                for (var i = padding; i < pointData.Count - padding; i++)
                {
                    if (anomalies.Contains(pointData[i])) indices.Add(i-2);
                }
            });
            yield return (new { id = sim.Id, anomaly_indices = indices });
        }
    }
}