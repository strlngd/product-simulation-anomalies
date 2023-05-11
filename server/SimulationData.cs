namespace Server;

public class SimulationData
{
    public string Id { get; set; }
    
    public double BuyFactor { get; set; }
    
    public IList<double> History { get; set; }

    public SimulationData(string id, double buyFactor, IList<double> history)
    {
        Id = id;
        BuyFactor = buyFactor;
        History = history;
    }
}