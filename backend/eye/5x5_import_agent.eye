WORKERS = 10


Eye.application 'maximiz.5x5_import_agent' do


  working_dir File.expand_path("../../../", __FILE__)


  group :workers do
    chain grace: 1.seconds
    WORKERS.times do |n|
      process "worker_#{n}" do
        stdall File.join('/logs',"5x5_import_agent#{n}.log")
        pid_file File.join('/tmp', "5x5_import_agent#{n}.pid")


        start_command "venv/bin/python 5x5_import_agent.py"
        stop_command 'kill -TERM {PID}'


        daemonize true
        stop_on_delete true


        check :memory, every: 20.seconds, below: 100.megabytes, times: 3
      end
    end
  end
end