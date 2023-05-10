using Microsoft.AspNetCore.Mvc;

namespace Server.Controllers;

[ApiController]
[Route("[controller]")]
public class SimulationController : Controller
{
    private readonly ILogger<SimulationController> _logger;

    public SimulationController(ILogger<SimulationController> logger)
    {
        _logger = logger;
    }

    [HttpGet("[action]")]
    public async Task<string> DetectAnomalies([FromBody] List<PurchaseData> purchaseData)
    {
        // Maybe take a list of products with id and buy_factor, then return buy totals for each product
        return "DetectAnomalies is working...";
    }
}