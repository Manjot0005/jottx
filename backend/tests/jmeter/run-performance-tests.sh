#!/bin/bash

# ===============================================
# JMeter Performance Testing Script
# Tests 4 configurations: B, B+S, B+S+K, B+S+K+Other
# ===============================================

echo "╔══════════════════════════════════════════════╗"
echo "║  JMETER PERFORMANCE TESTING                  ║"
echo "║  Testing: B, B+S, B+S+K, B+S+K+Other         ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Configuration
BACKEND_URL="http://localhost:5001"
THREADS=100
RAMP_UP=10
DURATION=60
RESULTS_DIR="results"

# Create results directory
mkdir -p $RESULTS_DIR

# Check if JMeter is installed
if ! command -v jmeter &> /dev/null; then
    echo "📦 Installing JMeter..."
    brew install jmeter
fi

echo "✅ JMeter is ready"
echo ""

# ===============================================
# TEST 1: BASE (B) - No optimizations
# ===============================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 1: BASE (B) - No Redis, No Kafka"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Config: Using simple backend with JSON file storage"
echo "Threads: $THREADS | Ramp-up: ${RAMP_UP}s | Duration: ${DURATION}s"
echo ""

# Create BASE test plan
cat > $RESULTS_DIR/base-test-plan.jmx << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2" properties="5.0" jmeter="5.6.3">
  <hashTree>
    <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="Kayak Base Performance Test">
      <elementProp name="TestPlan.user_defined_variables" elementType="Arguments">
        <collectionProp name="Arguments.arguments"/>
      </elementProp>
    </TestPlan>
    <hashTree>
      <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="Users">
        <stringProp name="ThreadGroup.num_threads">100</stringProp>
        <stringProp name="ThreadGroup.ramp_time">10</stringProp>
        <boolProp name="ThreadGroup.scheduler">true</boolProp>
        <stringProp name="ThreadGroup.duration">60</stringProp>
        <elementProp name="ThreadGroup.main_controller" elementType="LoopController">
          <boolProp name="LoopController.continue_forever">false</boolProp>
          <intProp name="LoopController.loops">-1</intProp>
        </elementProp>
      </ThreadGroup>
      <hashTree>
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="Get Flights">
          <stringProp name="HTTPSampler.domain">localhost</stringProp>
          <stringProp name="HTTPSampler.port">5001</stringProp>
          <stringProp name="HTTPSampler.path">/api/admin/listings/flights</stringProp>
          <stringProp name="HTTPSampler.method">GET</stringProp>
        </HTTPSamplerProxy>
        <hashTree/>
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="Get Hotels">
          <stringProp name="HTTPSampler.domain">localhost</stringProp>
          <stringProp name="HTTPSampler.port">5001</stringProp>
          <stringProp name="HTTPSampler.path">/api/admin/listings/hotels</stringProp>
          <stringProp name="HTTPSampler.method">GET</stringProp>
        </HTTPSamplerProxy>
        <hashTree/>
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="Get Cars">
          <stringProp name="HTTPSampler.domain">localhost</stringProp>
          <stringProp name="HTTPSampler.port">5001</stringProp>
          <stringProp name="HTTPSampler.path">/api/admin/listings/cars</stringProp>
          <stringProp name="HTTPSampler.method">GET</stringProp>
        </HTTPSamplerProxy>
        <hashTree/>
      </hashTree>
      <ResultCollector guiclass="SummaryReport" testclass="ResultCollector" testname="Summary Report">
        <boolProp name="ResultCollector.error_logging">false</boolProp>
        <objProp>
          <name>saveConfig</name>
          <value class="SampleSaveConfiguration">
            <time>true</time>
            <latency>true</latency>
            <timestamp>true</timestamp>
            <success>true</success>
            <label>true</label>
            <code>true</code>
            <message>true</message>
            <threadName>true</threadName>
            <dataType>true</dataType>
            <encoding>false</encoding>
            <assertions>true</assertions>
            <subresults>true</subresults>
            <responseData>false</responseData>
            <samplerData>false</samplerData>
            <xml>false</xml>
            <fieldNames>true</fieldNames>
            <responseHeaders>false</responseHeaders>
            <requestHeaders>false</requestHeaders>
            <responseDataOnError>false</responseDataOnError>
            <saveAssertionResultsFailureMessage>true</saveAssertionResultsFailureMessage>
            <assertionsResultsToSave>0</assertionsResultsToSave>
            <bytes>true</bytes>
            <sentBytes>true</sentBytes>
            <url>true</url>
            <threadCounts>true</threadCounts>
            <idleTime>true</idleTime>
            <connectTime>true</connectTime>
          </value>
        </objProp>
        <stringProp name="filename">$RESULTS_DIR/base-results.jtl</stringProp>
      </ResultCollector>
      <hashTree/>
    </hashTree>
  </hashTree>
</jmeterTestPlan>
EOF

echo "📊 Running BASE test..."
jmeter -n -t $RESULTS_DIR/base-test-plan.jmx -l $RESULTS_DIR/base-results.jtl > $RESULTS_DIR/base-console.log 2>&1

if [ $? -eq 0 ]; then
    echo "✅ BASE test completed"
    
    # Extract key metrics
    echo ""
    echo "📊 Results:"
    tail -20 $RESULTS_DIR/base-console.log | grep -E "(summary|Err:|samples)"
else
    echo "❌ BASE test failed"
fi

echo ""
echo "Results saved to: $RESULTS_DIR/"
echo ""
