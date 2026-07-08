var config = {
  _id: "rs0",
  members: [
    {
      _id: 0,
      host: "mongo:27017",
    },
  ],
};

function isPrimary(status) {
  if (status.myState === 1) {
    return true;
  }

  return (status.members || []).some(function (member) {
    return member.stateStr === "PRIMARY";
  });
}

try {
  var currentStatus = rs.status();
  if (isPrimary(currentStatus)) {
    print("Replica set rs0 is already primary-ready");
    quit(0);
  }
} catch (err) {
  print("Initializing replica set rs0");
  rs.initiate(config);
}

for (var i = 0; i < 60; i += 1) {
  try {
    var status = rs.status();
    if (isPrimary(status)) {
      print("Replica set rs0 is primary-ready");
      quit(0);
    }
  } catch (err) {
    print("Waiting for replica set status: " + err.message);
  }

  sleep(1000);
}

print("Replica set rs0 did not become primary in time");
quit(1);
