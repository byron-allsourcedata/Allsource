WORKERS = 2


Eye.application 'maximiz.5x5_users_files_agent' do


  working_dir File.expand_path("../../", __FILE__)


  group :workers do
    chain grace: 1.seconds
    WORKERS.times do |n|
      process "worker_#{n}" do
        stdall File.join('logs',"5x5_users_files_agent_#{n}.log")
        pid_file File.join('tmp', "5x5_users_files_agent_#{n}.pid")


        start_command "venv/bin/python bin/5x5_users_files_agent.py"
        stop_command 'kill -TERM {PID}'


        daemonize true
        stop_on_delete true


        check :memory, every: 20.seconds, below: 1000.megabytes, times: 3
      end
    end
  end
end
