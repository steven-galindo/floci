package io.github.hectorvent.floci.services.glue.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.quarkus.runtime.annotations.RegisterForReflection;

import java.time.Instant;
import java.util.Map;

@RegisterForReflection
public class GlueJob {

    @JsonProperty("Name")
    private String name;
    @JsonProperty("Role")
    private String role;
    @JsonProperty("Command")
    private JobCommand command;
    @JsonProperty("DefaultArguments")
    private Map<String, String> defaultArguments;
    @JsonProperty("NonOverridableArguments")
    private Map<String, String> nonOverridableArguments;
    @JsonProperty("Description")
    private String description;
    @JsonProperty("GlueVersion")
    private String glueVersion;
    @JsonProperty("MaxCapacity")
    private Double maxCapacity;
    @JsonProperty("MaxRetries")
    private Integer maxRetries;
    @JsonProperty("NumberOfWorkers")
    private Integer numberOfWorkers;
    @JsonProperty("Timeout")
    private Integer timeout;
    @JsonProperty("WorkerType")
    private String workerType;
    @JsonProperty("Tags")
    private Map<String, String> tags;
    @JsonProperty("CreatedOn")
    @JsonFormat(shape = JsonFormat.Shape.NUMBER)
    private Instant createdOn;
    @JsonProperty("LastModifiedOn")
    @JsonFormat(shape = JsonFormat.Shape.NUMBER)
    private Instant lastModifiedOn;

    public GlueJob() {}

    @RegisterForReflection
    public static class JobCommand {
        @JsonProperty("Name")
        private String name;
        @JsonProperty("ScriptLocation")
        private String scriptLocation;
        @JsonProperty("PythonVersion")
        private String pythonVersion;

        public JobCommand() {}

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getScriptLocation() { return scriptLocation; }
        public void setScriptLocation(String scriptLocation) { this.scriptLocation = scriptLocation; }
        public String getPythonVersion() { return pythonVersion; }
        public void setPythonVersion(String pythonVersion) { this.pythonVersion = pythonVersion; }
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public JobCommand getCommand() { return command; }
    public void setCommand(JobCommand command) { this.command = command; }
    public Map<String, String> getDefaultArguments() { return defaultArguments; }
    public void setDefaultArguments(Map<String, String> defaultArguments) { this.defaultArguments = defaultArguments; }
    public Map<String, String> getNonOverridableArguments() { return nonOverridableArguments; }
    public void setNonOverridableArguments(Map<String, String> nonOverridableArguments) { this.nonOverridableArguments = nonOverridableArguments; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getGlueVersion() { return glueVersion; }
    public void setGlueVersion(String glueVersion) { this.glueVersion = glueVersion; }
    public Double getMaxCapacity() { return maxCapacity; }
    public void setMaxCapacity(Double maxCapacity) { this.maxCapacity = maxCapacity; }
    public Integer getMaxRetries() { return maxRetries; }
    public void setMaxRetries(Integer maxRetries) { this.maxRetries = maxRetries; }
    public Integer getNumberOfWorkers() { return numberOfWorkers; }
    public void setNumberOfWorkers(Integer numberOfWorkers) { this.numberOfWorkers = numberOfWorkers; }
    public Integer getTimeout() { return timeout; }
    public void setTimeout(Integer timeout) { this.timeout = timeout; }
    public String getWorkerType() { return workerType; }
    public void setWorkerType(String workerType) { this.workerType = workerType; }
    public Map<String, String> getTags() { return tags; }
    public void setTags(Map<String, String> tags) { this.tags = tags; }
    public Instant getCreatedOn() { return createdOn; }
    public void setCreatedOn(Instant createdOn) { this.createdOn = createdOn; }
    public Instant getLastModifiedOn() { return lastModifiedOn; }
    public void setLastModifiedOn(Instant lastModifiedOn) { this.lastModifiedOn = lastModifiedOn; }
}
