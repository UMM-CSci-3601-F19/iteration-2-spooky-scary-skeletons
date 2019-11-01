package umm3601;

import com.mongodb.MongoClient;
import com.mongodb.client.MongoDatabase;
import spark.Request;
import spark.Response;
import spark.Route;
import spark.utils.IOUtils;
import umm3601.laundry.LaundryController;
import umm3601.laundry.LaundryRequestHandler;
import umm3601.user.UserController;
import umm3601.user.UserRequestHandler;

import static spark.Spark.*;
import java.io.InputStream;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class Server {
  // TODO: Delete user?
  private static final String userDatabaseName = "dev";
  // Historic Databases (not used yet)
  private static final String historicMachineDatabaseName = "dev";
  private static final String historicMachinePollingDatabaseName = "dev";
  private static final String roomDatabaseName = "dev";
  // Up-to-date Databases (in use now)
  private static final String currentMachineDatabaseName = "cur";
  private static final String currentMachinePollingDatabaseName = "cur";

  private static final int serverPort = 4567;

  public static void main(String[] args) {

    MongoClient mongoClient = new MongoClient();
    MongoDatabase userDatabase = mongoClient.getDatabase(userDatabaseName);
    // rooms
    MongoDatabase roomDatabase = mongoClient.getDatabase(roomDatabaseName);
    // historic data
    MongoDatabase historicMachineDatabase = mongoClient.getDatabase(historicMachineDatabaseName);
    MongoDatabase historicMachinePollingDatabase = mongoClient.getDatabase(historicMachinePollingDatabaseName);
    // current data
    MongoDatabase currentMachineDatabase = mongoClient.getDatabase(currentMachineDatabaseName);
    MongoDatabase currentMachinePollingDatabase = mongoClient.getDatabase(currentMachinePollingDatabaseName);

    PollingService pollingService = new PollingService(mongoClient);
    UserController userController = new UserController(userDatabase);
    UserRequestHandler userRequestHandler = new UserRequestHandler(userController);
    // pass in the constantly updating collection.
    LaundryController laundryController = new LaundryController(currentMachineDatabase, roomDatabase, currentMachinePollingDatabase);
    LaundryRequestHandler laundryRequestHandler = new LaundryRequestHandler(laundryController);

    // HappyHedgehogs code base - threading for updated current machine database (modified to run in PollingService instead of Server.
    final ScheduledExecutorService executorService = Executors.newSingleThreadScheduledExecutor();
    executorService.scheduleAtFixedRate(new Runnable() {
      @Override
      public void run() {
        pollingService.poll();
      }
    }, 0, 1, TimeUnit.MINUTES);

    //Configure Spark
    port(serverPort);

    // Specify where assets like images will be "stored"
    staticFiles.location("/public");

    options("/*", (request, response) -> {

      String accessControlRequestHeaders = request.headers("Access-Control-Request-Headers");
      if (accessControlRequestHeaders != null) {
        response.header("Access-Control-Allow-Headers", accessControlRequestHeaders);
      }

      String accessControlRequestMethod = request.headers("Access-Control-Request-Method");
      if (accessControlRequestMethod != null) {
        response.header("Access-Control-Allow-Methods", accessControlRequestMethod);
      }

      return "OK";
    });

    before((request, response) -> response.header("Access-Control-Allow-Origin", "*"));

    // Redirects for the "home" page
    redirect.get("", "/");

    Route clientRoute = (req, res) -> {
      InputStream stream = Server.class.getResourceAsStream("/public/index.html");
      return IOUtils.toString(stream);
    };

    get("/", clientRoute);

    /// Endpoints ///////////////////////////////
    /////////////////////////////////////////////

    // List machines

    get("api/rooms", laundryRequestHandler::getRooms);
    get("api/rooms/:room/machines", laundryRequestHandler::getRoomMachines);
    get("api/machines", laundryRequestHandler::getMachines);
    get("api/machines/:machine", laundryRequestHandler::getMachineJSON);
//  get("api/change_machine_status/:machine_id/:status", laundryRequestHandler::changeMachineStatus);

    // List users, filtered using query parameters

    get("api/users", userRequestHandler::getUsers);
    get("api/users/:id", userRequestHandler::getUserJSON);
    post("api/users/new", userRequestHandler::addNewUser);

    // An example of throwing an unhandled exception so you can see how the
    // Java Spark debugger displays errors like this.
    get("api/error", (req, res) -> {
      throw new RuntimeException("A demonstration error");
    });

    // Called after each request to insert the GZIP header into the response.
    // This causes the response to be compressed _if_ the client specified
    // in their request that they can accept compressed responses.
    // There's a similar "before" method that can be used to modify requests
    // before they they're processed by things like `get`.
    after("*", Server::addGzipHeader);

    get("/*", clientRoute);

    // Handle "404" file not found requests:
    notFound((req, res) -> {
      res.type("text");
      res.status(404);
      return "Sorry, we couldn't find that!";
    });
  }

  // Enable GZIP for all responses
  private static void addGzipHeader(Request request, Response response) {
    response.header("Content-Encoding", "gzip");
  }
}
