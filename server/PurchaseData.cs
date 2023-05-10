namespace Server;

public class PurchaseData
{
    public string Id { get; set; }
    
    public double BuyFactor { get; set; }
    public IList<int> History { get; set; }

    public PurchaseData(string id, double buyFactor, IList<int> history)
    {
        Id = id;
        BuyFactor = buyFactor;
        History = history;
    }
}