package umm3601;

import com.mongodb.MongoClient;
import com.mongodb.MongoClientOptions;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;

import com.mongodb.internal.connection.Time;
import org.bson.*;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.*;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

class PollingService {

  private MongoClient mongoClient;
  private String baseApiUrl = "http://155.138.235.83:5000/";

  private final MongoCollection<Document> historicMachineDataFromPollingAPICollection;
  private static final String historicMachineDataFromPollingAPIDatabaseName = "dev";

  private final MongoCollection<Document> currentMachineDataFromPollingAPICollection;
  private static final String currentMachineDataFromPollingAPIDatabaseName = "cur";

  PollingService(MongoClient mongoClient) {
    this.mongoClient = mongoClient;
    // Set up historic machine data
    MongoDatabase historicMachineDataFromPollingAPIDatabase = mongoClient.getDatabase(historicMachineDataFromPollingAPIDatabaseName);
    historicMachineDataFromPollingAPICollection = historicMachineDataFromPollingAPIDatabase.getCollection("historicMachineDataFromPollingAPI");

    // Set up current machine data
    MongoDatabase currentMachineDataFromPollingAPIDatabase = mongoClient.getDatabase(currentMachineDataFromPollingAPIDatabaseName);
    currentMachineDataFromPollingAPICollection = currentMachineDataFromPollingAPIDatabase.getCollection("currentMachineDataFromPollingAPI");

    this.poll();
  }

  public void poll() {
    try {
      URL url = new URL(baseApiUrl + "machines");
      HttpURLConnection conn = (HttpURLConnection) url.openConnection();
      conn.setRequestMethod("GET");
      conn.connect();
      int responsecode = conn.getResponseCode();
      if (responsecode != 200) {
        throw new RuntimeException("Unexpected HttpResponseCode when looking for 200: " + responsecode);
      } else {
        //the response code suggests all is well and we need to get the string from the stream
        String inline = "";
        Scanner sc = new Scanner(url.openStream());
        while (sc.hasNext()) {
          String item = sc.nextLine();
          inline += item;
        }
        //System.out.println("\nJSON data in string format");
        //System.out.println(inline);
        sc.close();
        //use that string to update machine data
        updateAllMachineData(inline);
      }

    } catch (MalformedURLException exception) {
      System.out.println("The url: " + baseApiUrl + "machines" + " was malformed.");
      exception.printStackTrace();
    } catch (IOException ioException) {
      ioException.printStackTrace();
    }

  }

  private void updateAllMachineData(String responseData) {
    currentMachineDataFromPollingAPICollection.drop();

    BsonArray theArray = BsonArray.parse(responseData);
    Iterator<BsonValue> bsonValues = theArray.iterator();
    //System.out.println("THE ARRAY OF DATA IS THIS MANY ITEMS:" + theArray.size());

    while (bsonValues.hasNext()) {
      BsonDocument thisDocument = bsonValues.next().asDocument();
      //System.out.println(thisDocument);

      Document d = new Document();
      for (Map.Entry<String, BsonValue> e : thisDocument.entrySet()) {
        d.append(e.getKey(), e.getValue());
      }

      //It would probably be better to use the timestamp of the database, but this might make it easier to index
      d.append("timestamp", "" + Time.nanoTime());
      historicMachineDataFromPollingAPICollection.insertOne(d);
      currentMachineDataFromPollingAPICollection.insertOne(d);
    }
  }

}
