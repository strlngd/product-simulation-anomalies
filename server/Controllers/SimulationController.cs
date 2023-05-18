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
                var pointData = ConvertToPointData(sim, padding);
                
                // We define the epsilon value of DBScan as the sim factor divided by 3 with a minimum of 8 points per cluster.
                // Throughout testing, these were the simplest values used to generate a decent result.
                var clusterSet = Dbscan.Dbscan.CalculateClusters(pointData, sim.BuyFactor / 3, 8);

                // Note: DBSCAN only returns the values and not the indices. We could fork the repo and modify the library for a performance boost.
                // This will not be done as this project is more of a concept/prototype. Thus, we will filter through the points and compare with hashset.
                var anomalies = new HashSet<SimulationPoint>(clusterSet.UnclusteredObjects);
                
                // Ignore anomalies if the data point is was generated from padding.
                for (var i = padding; i < pointData.Count - padding; i++)
                {
                    if (anomalies.Contains(pointData[i])) indices.Add(i-2);
                }
            });
            yield return (new { id = sim.Id, anomaly_indices = indices });
        }
    }

    /// <summary>
    /// Converts SimulationData to a list of Simulation Points
    /// </summary>
    /// <param name="simulationData"></param>
    /// <param name="padding">Padding for point data (helps reduce false positives from DBSCAN on head/tail of data.</param>
    /// <returns></returns>
    private List<SimulationPoint> ConvertToPointData(SimulationData simulationData, int padding)
    {
        var pointData = new List<SimulationPoint>();
        
        // Padding logic
        for (var i = 0; i < padding; i++)
            pointData.Add(new SimulationPoint(0, simulationData.History[0]));
        pointData.AddRange(simulationData.History.Select((t, i) => new SimulationPoint(0, t)));
        for (var i = 0; i < padding; i++)
            pointData.Add(new SimulationPoint(0, simulationData.History[^1]));
        
        return pointData;
    }
}